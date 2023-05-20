import { render, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { query } from '../mastodon-query';
import AccountWithToots from './AccountWithToots';
import Toot from './Toot'
import { compareTootId, ready, getAppCreds, getAccessToken } from '../functions'

const ReverseList = () => {
	const appCreds = getAppCreds()
	const accessToken = getAccessToken()

	const [ accts, setAccts ] = useState( [] )
	const [ toots, setToots ] = useState( [] )
	const [ mode, setMode ] = useState( 'list' )
	const [ lastLoadedId, setLastLoadedId ] = useState( null )
	const [ watchForBottom, setWatchForBottom ] = useState( false )
	const bottomObserverRef = useRef( null );
	const topObserverRef = useRef( null );
	const [ rateLimited, setRateLimited ] = useState( false )
	const [ unauthorized, setUnauthorized ] = useState( false )


	const handleLogout = () => {
		localStorage['mastodon-user-access-token'] = ''
		window.location = '/'
	}

	const loadToots = ( loadFromId, append = false ) => {
		if ( ! accessToken ) {
			console.log("no access token, aborting load operation")
			return
		}

		if ( !! localStorage['rateLimitReset'] && new Date(localStorage['rateLimitReset']) > new Date()) {
			setRateLimited( true )
			return;
		}

		let homeQuery = '/api/v1/timelines/home?limit=5';

		if ( !! loadFromId ) {
			homeQuery = homeQuery + `&min_id=${ loadFromId }`
		}

		setWatchForBottom( false ) // disable while query is happening

		query( appCreds.instance, accessToken, homeQuery )
			.then ( newToots => {

				if ( 0 === newToots.length ) {
					document.getElementById( 'bottom-indicator' ).innerText = 'No more toots'
					return;
				}

				newToots.sort( ( a, b ) => compareTootId( a.id, b.id ) )

				if ( append ) {
					newToots = toots.concat( newToots )
				}

				setToots( newToots )

				const lastLoadedId = newToots[ newToots.length - 1 ].id;
				setLastLoadedId( lastLoadedId )
				setWatchForBottom( true )

				// TODO: maybe remove this since the idea kind of isn't great, and it won't work with new toot query
				let acctToots = {}

				newToots.forEach( toot => {
					if ( ! acctToots[ toot.account.acct ] ) {
						// console.log(toot.account)
						acctToots[ toot.account.acct ] = {
							acct: toot.account.acct,
							avatar: toot.account.avatar,
							header: toot.account.header,
							toots: [],
						}
					}

					acctToots[ toot.account.acct ].toots.push( toot )
				} )

				// console.log(acctToots)

				let acctList = []
				Object.keys( acctToots ).forEach( a => {
					const account = acctToots[a];
					acctList.push( account )
				} )

				setAccts( acctList )

			} )
			.catch( error => {
				console.log("ERROR CAUGHT")
				console.log(error)

				if ( 429 === error.response.status ) {
					setRateLimited( true )
					try {
						localStorage['rateLimitReset'] = error.response.headers['x-ratelimit-reset']
					} catch ( ex ) {
						console.err('cannot access localstorage to set rateLimitReset')
					}
				} else if ( 401 === error.response.status ) {
					setUnauthorized( true )
				}
			})
	}


	useEffect( () => {
		let options = {
		  root: null,
		  rootMargin: "0px",
		  threshold: 1.0,
		};

		let callback = ( entries, observer ) => {
			entries.forEach( ( entry ) => {
				if ( entry.isIntersecting ) {
					localStorage['prev2LastSeenId'] = localStorage['prevLastSeenId']
					localStorage['prevLastSeenId'] = localStorage['lastSeenId']
					localStorage['lastSeenId'] = entry.target.attributes.tootid.value
					 
				}
			} );
		};

		topObserverRef.current = new IntersectionObserver(callback, options);
	}, [] )

	useEffect( () => {
		const bottomIndicatorEl = document.getElementById( 'bottom-indicator' );

		if ( ! bottomIndicatorEl ) {
			return;
		}

		if ( bottomObserverRef.current ) {
			bottomObserverRef.current.unobserve( bottomIndicatorEl )
		}

		let options = {
		  root: null,
		  rootMargin: "0px",
		  threshold: 1.0,
		};

		let callback = ( entries, observer ) => {
			entries.forEach( ( entry ) => {

				if ( ! watchForBottom ) {
					return;
				}

				if ( entry.isIntersecting ) {
					loadToots( lastLoadedId, true )
				}
			} );
		};

		bottomObserverRef.current = new IntersectionObserver(callback, options);

		bottomObserverRef.current.observe( bottomIndicatorEl );

	}, [ lastLoadedId, watchForBottom ])

	useEffect( () => {
		/*
			Load toots from last seen
			- use local last seen
			- if not set, use mastodon marker
			- if that request fails, just do a search with default behaviour
		*/
		try {
			let lastSeenId = localStorage['prev2LastSeenId'] ?? '110437232023975165'
			loadToots( lastSeenId )
		} catch (ex) {
			console.log( 'could not retrieve last saved state (localStorage access failed). Checking markers.' )

			query( appCreds.instance, accessToken, '/api/v1/markers?timeline[]=home' )
				.then( r => {
					loadToots( r.last_read_id )
				} )
				.catch( e => loadToots() )
		}
	}
	, []);

	let tootContent = null

	if ( mode === 'acct-group' ) {
		tootContent = <div className="acct-group">
			{ accts.map( ( a, i ) => <AccountWithToots key={i} accountWithToots={ a } /> ) }
		</div>
	} else if ( mode === 'list' ) {
		tootContent = <div className="toots-list">
			{ toots.map( ( t, i ) => <Toot key={i} toot={ t } showAuthor={ true } observe={ ( el ) => topObserverRef.current.observe( el ) } /> ) }
		</div>
	} else {
		tootContent = "invalid mode"
	}

	if ( ! accessToken ) {
		return (
			<>
				<h1>Welcome to Completionist.social</h1>
				<p>
					blah blah blah mastodon app to view your Home feed in top to bottom chronological order.
				</p>
				<p>
					<a href='/login'>Login</a>
				</p>
			</>
		)
	}

	/*
		<button onClick={ () => setMode('acct-group')}>Acct</button>
		<button onClick={ () => setMode('list')}>List</button>
	*/
	return (
		<>
			<div className="title">Messages</div>
			<button onClick={ handleLogout }>Logout</button>
			{
				tootContent
			}
			<div className="error">{ rateLimited && ( `Rate limited until ${localStorage['rateLimitReset']}` ) }</div>
			<div className="error">{ unauthorized && ( 
				<>
					<span>Request for Toots failed because the app is not authorized, try logging in again.</span>
					<a href='/login'>Login again</a>
				</>
			) }
			</div>
			<div id='bottom-indicator'>Loading more...</div>
		</>
	)
}

export default ReverseList;