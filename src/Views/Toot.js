import moment from 'moment';
import { Fragment } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { noop, getAppCreds, getAccessToken } from '../functions'
import { query } from '../mastodon-query'

export default function Toot( { toot, showAuthor = false, booster = null, boosterId = null, observe = noop } ) {

	const html = toot.content !== '' ? toot.content : ( toot.reblog?.content ?? '' )

	if ( !! toot.reblog ) {
		return (
			<Toot toot={ toot.reblog } showAuthor={ true } booster={ toot.account } boosterId={ toot.id } observe={ observe } />
		)
	}
	const idRef = useRef( null )

	const tootId = boosterId ?? toot.id;

	useEffect( () => {
		if ( null == idRef.current ) {
			return;
		}

		observe( idRef.current )
	}, [ idRef ] )

	const renderCard = ( card ) => {
		if ( ! card ) {
			return
		}

		if ( 'link' === card.type ) {
			return (
				<a className="link" href={ card.url }>
					<img src={ card.image } alt={ card.description } />
					<span>{ card.title }</span>
				</a>
			)
		}

		if ( 'video' === card.type ) {
			return (
				<>
					<div className="video" dangerouslySetInnerHTML={{ __html: card.html }} />
					<a className="link" href={ card.url }>{ card.title }</a>
				</>
			)
		}
	}

	const handleRepliesClick = () => {
		// query( getAppCreds().instance, getAccessToken(), `/api/v1/statuses/${ toot.id }/context` )
			// .then( r => console.log( r ) )

		window.open( `https://${ getAppCreds().instance }/@${ toot.account.acct }/${ toot.id }` )
	}

	return (
		<div className="toot">
			{
				!! booster && (
					<div className="header-bar booster">
						<span>Boosted by</span>
						<img className="avatar" src={booster.avatar} />
						<div className="name" onClick={ () => window.open( booster.url ) }>{ booster.acct }</div>
					</div>
				)
			}
			{
				showAuthor && (
					<div className="header-bar">
						<img className="avatar" src={toot.account.avatar} />
						<div className="name" onClick={ () => window.open( toot.account.url ) }>{ toot.account.acct }</div>
					</div>
				)
			}
			<div className="timestamp" title={toot.created_at}>{moment(toot.created_at).fromNow()}</div>
			<button className="replies" onClick={ handleRepliesClick }>see toot ({ toot.replies_count } replies)</button>
			<div className="content" dangerouslySetInnerHTML={{ __html: html }} />
			{ toot.card && (
				<div className="card">
					{ renderCard( toot.card ) }
				</div>
			) }
			<div className="media">
				{ toot.media_attachments.map( m => {
					if ( 'image' === m.type ) {
						return <img src={m.url} alt={m.description} title={m.description} />
					} else if ( 'video' === m.type ) {
						return (
							<video controls="true">
								<source src={m.url} type="video/mp4"/>
							</video>
						)
					}
				} ) }
			</div>
			<span ref={ idRef } tootId={ tootId }></span>
		</div>
	);
}
