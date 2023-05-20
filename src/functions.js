export function ready(fn) {
	if (document.readyState !== 'loading') {
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

export const compareTootId = ( a, b ) => {
					if ( a.length > b.length ) {
						return 1
					} else if ( a.length < b.length ) {
						return -1
					} else if ( a > b ) {
						return 1
					} else if ( a < b ) {
						return -1
					} else {
						0
					}
				}

export const noop = () => {}

export const getAppCreds = () => {
	let storedCreds = localStorage['mastodon-app-creds']

	if ( ! storedCreds ) {
		return null
	}

	return JSON.parse( storedCreds )
}

export const getAccessToken = () => {
	return localStorage['mastodon-user-access-token']
}

export const getServerName = () => {
	let port = ''

	if ( window.location.port !== '' && window.location.port !== "80" && window.location.port !== "443" ) {
		port = `:${ window.location.port }`
	}

	return `${ window.location.protocol }//${ window.location.hostname }${ port }`
}