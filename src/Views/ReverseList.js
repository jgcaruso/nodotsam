import { render, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { query } from '../mastodon-query';
import Toot from './Toot'
import About from './About'
import Toggle from './Toggle'
import { compareTootId, ready, getAppCreds, getAccessToken } from '../functions'

const ReverseList = ( { feed } ) => {
	const appCreds = getAppCreds()
	const accessToken = getAccessToken()

	const [ toots, setToots ] = useState( [] )
	const [ displayedToots, setDisplayedToots ] = useState( [] )
	const [ lastLoadedId, setLastLoadedId ] = useState( null )
	const [ watchForBottom, setWatchForBottom ] = useState( false )
	const bottomObserverRef = useRef( null );
	const topObserverRef = useRef( null );
	const [ rateLimited, setRateLimited ] = useState( false )
	const [ errorCode, setErrorCode ] = useState( 0 )
	const [ hideBoosts, setHideBoosts ] = useState( false )

	const handleLogout = () => {
		localStorage['mastodon-user-access-token'] = ''
		window.location = '/'
	}

	const handleFeedChanged = ( e ) => {
		const feed = e.target.value

		if ( 'home' === feed ) {
			window.location = `/`
			return
		}

		window.location = `/${ feed }`
	}

	const hideBoostsChanged = ( enabled ) => {
		setHideBoosts( enabled )
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

		let feedPath = 'home'
		if ( 'local' === feed || 'federated' === feed ) {
			feedPath = 'public'
		}

		let feedQuery = `/api/v1/timelines/${ feedPath }?limit=20`;

		if ( !! loadFromId ) {
			feedQuery = feedQuery + `&min_id=${ loadFromId }`
		}

		if ( 'local' === feed ) {
			feedQuery = feedQuery + `&local=true`
		} else if ( 'federated' === feed ) {
			feedQuery = feedQuery + `&remote=true`
		}

		setWatchForBottom( false ) // disable while query is happening

		query( appCreds.instance, accessToken, feedQuery )
			.then ( newToots => {
				setErrorCode( 0 )

				if ( 0 === newToots.length ) {
					document.getElementById( 'bottom-indicator' ).innerText = append ? 'No more toots' : 'No unread toots'

					// check again in some number of seconds
					setTimeout( () => {
						document.getElementById( 'bottom-indicator' ).innerText = 'checking...'
						loadToots( loadFromId, true )
					}, 60000)

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
			} )
			.catch( error => {
				console.log("ERROR CAUGHT")
				console.log(error)

				if ( ! error.response ) {
					console.log('non-server error - no response available')
				} else if ( 429 === error.response.status ) {
					setRateLimited( true )
					try {
						localStorage['rateLimitReset'] = error.response.headers['x-ratelimit-reset']
					} catch ( ex ) {
						console.error('cannot access localstorage to set rateLimitReset')
					}
				} else if ( 403 === error.response.status ) {
					setErrorCode( 403 )
				} else if ( 401 === error.response.status ) {
					setErrorCode( 401 )
				}
			} )
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
					let seenState = []
					try {
						seenState = JSON.parse( localStorage[`${ feed }SeenState`] )
					} catch ( ex ) {
						// ignore
						console.error( 'cannot access seen state' )
					}

					const currentTootId = entry.target.attributes.tootid.value

					if ( -1 === seenState.indexOf( currentTootId ) ) {
						seenState.push( currentTootId )
					}

					// lazy dequeue: reverse, pop, reverse
					seenState.reverse()

					// TODO: 3 might not be a great default, maybe 2?
					// need more testing when constantly refreshing to ensure the same toot keeps appearing
					while ( seenState.length > 3 ) {
						seenState.pop()
					}

					seenState.reverse()

					try {
						localStorage[`${ feed }SeenState`] = JSON.stringify( seenState )
					} catch( ex ) {
						console.error( 'cannot access seen state' )
					}
				}
			} );
		};

		topObserverRef.current = new IntersectionObserver( callback, options );
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
		let lastSeenId = null
		try {
			let seenState = JSON.parse( localStorage[`${ feed }SeenState`] )

			lastSeenId = seenState[0]
		} catch (ex) {
			console.log( 'could not retrieve last saved state (localStorage access failed). Checking markers.' )
		}

		if ( lastSeenId ) {
			loadToots( lastSeenId )
		} else {
			query( appCreds.instance, accessToken, `/api/v1/markers?timeline[]=${ feed }` ) // NOTE: this might not be valid for anything but HOME
				.then( r => {
					loadToots( r.last_read_id )
				} )
				.catch( e => loadToots() )
		}
	}
	, []);

	useEffect( () => {
		// update displayed toots

		if ( hideBoosts ) {
			setDisplayedToots( toots.filter( t => ! t.reblog ) )
		} else {
			setDisplayedToots( toots )
		}
	}, [ hideBoosts, toots ] )

	useEffect( () => {
		// wait for state to update before loading more toots
		if ( 0 === displayedToots.length ) {
			return
		}

		setTimeout( () => {
			loadToots( lastLoadedId, true )
		}, 1000 )
	}, [ displayedToots ] )

	let tootContent = null

	tootContent = <div className="toots-list">
			{ displayedToots.map( ( t, i ) => <Toot key={i} toot={ t } showAuthor={ true } observe={ ( el ) => topObserverRef.current.observe( el ) } /> ) }
		</div>

	if ( ! accessToken ) {
		return <About />
	}

	return (
		<>
			<div className="header">
				<div className="title">
					<span>nodotsam.party</span>
					<Toggle toggleId="hideBoosts" onChange={ hideBoostsChanged }>Hide Boosts</Toggle>
					<button onClick={ handleLogout }>Logout</button>
				</div>
				<select className="feed-selector" onChange={ handleFeedChanged }>
					<option value="home" selected={ 'home' === feed }>Home</option>
					<option value="local" selected={ 'local' === feed }>Local</option>
					<option value="federated" selected={ 'federated' === feed }>Federated</option>
				</select>
			</div>
			<div className="toots-wrapper">
				{
					tootContent
				}
				<div className="error">{ rateLimited && ( `Rate limited until ${localStorage['rateLimitReset']}` ) }</div>
				<div className="error">{ 401 === errorCode && (
					<>
						<span>Request for Toots failed because the app is not authorized, try logging in again.</span>
						<a href='/login'>Login again</a>
					</>
				) }
				{ 403 === errorCode && (
					<>
						<span>Request for Toots failed because the stored credentials are unauthorized, try logging in again.</span>
						<a href='/login'>Login again</a>
					</>
				) }
				</div>
				<div id='bottom-indicator'>Loading more...</div>
			</div>
			<div className="footer">
				{ displayedToots.length > 0 && ( <div className="toot-count">{ displayedToots.length }</div> ) }
			</div>
		</>
	)
}

export default ReverseList;