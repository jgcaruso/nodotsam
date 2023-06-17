import { render, Fragment } from 'preact';

export default function About( { showHomeLink = false }) {
	return (
		<>
			<h1>Welcome to Completionist.social</h1>
			<p>
				blah blah blah mastodon app to view your Home feed in top to bottom chronological order.
			</p>
			<p>
				<a href='/login'>Login</a>
			</p>
			
			{ showHomeLink && (
				<p>
					<a href='/'>Home</a>
				</p>
			) }
		</>
	)
}
