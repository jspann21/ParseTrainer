<?php

namespace App\Console\Commands;

use HebrewParseTrainer\Root;
use HebrewParseTrainer\RootKind;
use HebrewParseTrainer\RootTranslation;
use HebrewParseTrainer\Stem;
use HebrewParseTrainer\Tense;
use HebrewParseTrainer\Verb;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ExportStaticTrainerData extends Command
{
    protected $signature = 'trainer:export-static-data {--out=src/data/parsetrainer-data.json}';

    protected $description = 'Export active ParseTrainer data into a static JSON dataset for the frontend';

    public function handle(): int
    {
        $out = base_path($this->option('out'));

        $translations = RootTranslation::all()->pluck('translation', 'root');

        $activeRoots = Verb::where('active', 1)
            ->distinct()
            ->pluck('root')
            ->all();

        $roots = Root::with('kind')
            ->whereIn('root', $activeRoots)
            ->orderBy('root_kind_id')
            ->orderBy('root')
            ->get();

        $data = [
            'meta' => [
                'generatedAt' => gmdate('c'),
                'source' => 'db_active_verbs',
                'version' => 1,
            ],
            'stems' => Stem::orderBy('id')
                ->get(['name'])
                ->map(function ($stem) {
                    return [
                        'name' => $stem->name,
                    ];
                })
                ->values()
                ->all(),
            'tenses' => Tense::orderBy('id')
                ->get(['name', 'abbreviation'])
                ->map(function ($tense) {
                    return [
                        'name' => $tense->name,
                        'abbreviation' => $tense->abbreviation,
                    ];
                })
                ->values()
                ->all(),
            'rootKinds' => RootKind::orderBy('id')
                ->get(['id', 'strong', 'name'])
                ->map(function ($kind) {
                    return [
                        'id' => (int) $kind->id,
                        'strong' => (bool) $kind->strong,
                        'name' => $kind->name,
                    ];
                })
                ->values()
                ->all(),
            'roots' => $roots
                ->map(function ($root) use ($translations) {
                    return [
                        'root' => $root->root,
                        'rootKindId' => $root->root_kind_id ? (int) $root->root_kind_id : null,
                        'rootKindName' => $root->kind ? $root->kind->name : null,
                        'translation' => $translations[$root->root] ?? null,
                    ];
                })
                ->values()
                ->all(),
            'verbs' => Verb::where('active', 1)
                ->orderBy('id')
                ->get(['id', 'verb', 'root', 'stem', 'tense', 'person', 'gender', 'number'])
                ->map(function ($verb) {
                    return [
                        'id' => (int) $verb->id,
                        'verb' => $verb->verb,
                        'root' => $verb->root,
                        'stem' => $verb->stem,
                        'tense' => $verb->tense,
                        'person' => is_null($verb->person) ? null : (string) $verb->person,
                        'gender' => $verb->gender,
                        'number' => $verb->number,
                    ];
                })
                ->values()
                ->all(),
        ];

        File::ensureDirectoryExists(dirname($out));

        file_put_contents(
            $out,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL
        );

        $this->info('Exported dataset to: ' . $out);

        return self::SUCCESS;
    }
}
