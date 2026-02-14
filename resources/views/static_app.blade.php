@extends('layouts.master')

@section('master-content')
<div class="row">
	<div class="col-md-12">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h3 class="panel-title">Static Frontend Migration</h3>
			</div>
			<div class="panel-body">
				<p>The trainer UI is now a static React app for GitHub Pages deployment.</p>
				<p>Build and serve the static app from the repository root with:</p>
				<pre><code>npm install
npm run dev</code></pre>
				<p>Legacy Blade/jQuery pages and login features have been removed from this codebase.</p>
			</div>
		</div>
	</div>
</div>
@endsection
