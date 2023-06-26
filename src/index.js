import { render, Fragment } from 'preact';
import Router from 'preact-router'
import { useState, useEffect, useRef } from 'preact/hooks';
import './style.css';
import ReverseList from './Views/ReverseList'
import Login from './Views/login'
import { query, getOauthCreds } from './mastodon-query'
import { getAppCreds, getAccessToken } from './functions'
import OauthCallback from './Views/OauthCallback'
import About from './Views/About'

const Page = () => {
	return (
		<div className="page">
			<Router>
				<ReverseList path='/' feed='home' />
				<ReverseList path='/local' feed='local' />
				<ReverseList path='/federated' feed='federated' />
				<About path='/about' showHomeLink={ true } />
				<OauthCallback path='/callback' />
				<Login path='/login' />
			</Router>
		</div>
	)
}

render(<Page />, document.body);