import { render, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

import { createApp, getOauthCreds, query, redirectUri } from '../mastodon-query'
import { getAppCreds, getServerName } from '../functions'

export default function Login () {
	const [ instance, setInstance ] = useState( '' );
	const [ showConnecting, setShowConnecting ] = useState( false )

	const handleConnect = () => {
		setShowConnecting( true )

		let cleanedInstance = instance.trim()

		if ( cleanedInstance.endsWith( '/' ) ) {
			cleanedInstance = cleanedInstance.substring( 0, cleanedInstance.length - 1 )
		}

		if ( cleanedInstance.startsWith( 'http://' ) || cleanedInstance.startsWith( 'https://' ) ) {
			cleanedInstance = cleanedInstance.replace( 'http://', '' ).replace( 'https://', '' )
		}

		setInstance( cleanedInstance )

		const requestOauthCreds = ( instance, client_id, client_secret ) => {
			getOauthCreds( instance, client_id, client_secret, 'client_credentials' )
				.then( resOauth => {
					window.location = `https://${ instance }/oauth/authorize?client_id=${ client_id }&scope=read+write+push&redirect_uri=${ redirectUri }&response_type=code`
				} )
		}

		const appCreds = getAppCreds()

		if ( cleanedInstance !== appCreds?.instance || getServerName() !== appCreds?.servername ) {
			console.log('creating new app for ' + cleanedInstance )
			createApp( cleanedInstance )
				.then( resApp => {
					localStorage['mastodon-app-creds'] = JSON.stringify( {
						instance: cleanedInstance,
						servername: getServerName(),
						client_id: resApp.client_id,
						client_secret: resApp.client_secret,
					} )

					requestOauthCreds( cleanedInstance, resApp.client_id, resApp.client_secret )
				} )
		} else {
			console.log('using stored creds for ' + appCreds.instance )
			requestOauthCreds( appCreds.instance, appCreds.client_id, appCreds.client_secret )
		}
	}
	return (
		<>
			<div>Login</div>

			<div className="connect-controls">
				<label for='instance'>Enter Your Instance's Domain</label>
				<input id='instance' value={instance} onChange={ ( e ) => setInstance( e.target.value ) } />
				<button onClick={ handleConnect }>Connect</button>
			</div>

			{ showConnecting && <div>Connecting...</div> }
		</>
	)
}
