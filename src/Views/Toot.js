import moment from 'moment';
import { useEffect, useRef } from 'preact/hooks';
import { noop } from '../functions'

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

	return (
		<div className="toot">
			{
				!! booster && (
					<div className="header-bar booster">
						<span>Boosted by</span>
						<img className="avatar" src={booster.avatar} />
						<div className="name">{ booster.acct }</div>
					</div>
				)
			}
			{
				showAuthor && (
					<div className="header-bar">
						<img className="avatar" src={toot.account.avatar} />
						<div className="name">{ toot.account.acct }</div>
					</div>
				)
			}
			<div className="timestamp" title={toot.created_at}>{moment(toot.created_at).fromNow()}</div>
			<div className="content" dangerouslySetInnerHTML={{ __html: html }} />
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
