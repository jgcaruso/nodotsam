import axios from 'axios'
import { getServerName } from './functions'


export const redirectUri = `${ getServerName() }/callback`
export const appName = 'nodotsam.party'

export function createApp( instance ) {
	const promise = new Promise( ( resolve, reject ) => {
		axios( {
			method: 'POST',
			url: `https://${ instance }/api/v1/apps`,
			data: {
				client_name: appName,
				redirect_uris: redirectUri,
				scopes: 'read write push',
				website: 'https://johncaruso.ca'
			},
		} )
			.then( response => response.data )
			.then( resolve )
			.catch( reject )
 	} )

	return promise
}

export function getOauthCreds( instance, clientId, clientSecret, grantType, extra = {} ) {
	const promise = new Promise( ( resolve, reject ) => {
		let requestData = {
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			grant_type: grantType
		}

		if ( 'authorization_code' === grantType ) {
			if ( ! extra.code ) {
				reject( 'grant type "authorization_code" requires a code')
				return
			}
			requestData.code = extra.code
			requestData.scope = 'read write push'
		}

		axios( {
			method: 'POST',
			url: `https://${ instance }/oauth/token`,
			data: requestData,
		} )
			.then( response => response.data )
			.then( resolve )
			.catch( reject )
 	} )

	return promise
}

export function query( instance, token, path ) {
	const promise = new Promise( ( resolve, reject ) => {

		if ( ! path.startsWith( '/' ) ) {
			path = `/${path}`
		}

		axios( {
			method: 'GET',
			url: `https://${ instance }${ path }`,
			headers: {
				Authorization: 'Bearer ' + token
			},
		} )
			.then( response => response.data )
			.then( resolve )
			.catch( reject )
	} )

	return promise
}
