import { render, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { getOauthCreds, query } from '../mastodon-query'
import { getAppCreds } from '../functions'

const OauthCallback = () => {
	const [ errorMessage, setErrorMessage ] = useState( null )

	const appCreds = getAppCreds()
	const urlParams = new URLSearchParams( window.location.search );
	const oauthCode = urlParams.get( 'code' );

	useEffect( () => {
		getOauthCreds( appCreds.instance, appCreds.client_id, appCreds.client_secret, 'authorization_code', { code: oauthCode } )
			.then( resOauth => {
				query( appCreds.instance, resOauth.access_token, '/api/v1/accounts/verify_credentials')
					.then ( resVerify => {
						console.log("CREDS ARE GOLDEN")

						localStorage['mastodon-user-access-token'] = resOauth.access_token

						window.location = '/'
					} )
					.catch ( e => {
						console.log( 'error validating credentials', e )
						setErrorMessage( 'Error validating access token, try logging in again.')
					})
			} )
			.catch ( e => {
				console.log( 'error with oauth creds', e )
				setErrorMessage( 'Error validating oauth credentials, try logging in again.')
			} )
	}, [] )


	return (
		<>
			<div className={errorMessage ? 'error' : ''}>{ errorMessage ?? 'Validating oauth' }</div>
		</>
	)
}

export default OauthCallback;