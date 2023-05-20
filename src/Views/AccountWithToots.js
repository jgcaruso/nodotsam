import Toot from './Toot'
import { useState } from 'preact/hooks'

export default ( { accountWithToots } ) => {
	const [ show, setShow ] = useState( false )
	const handleClick = ( event ) => {
		setShow( true )
	}
	const clsShow = show ? 'show' : ''

	return (
		<div className="account" onClick={ handleClick }>
			<div className="header-bar">
				<img className="avatar" src={accountWithToots.avatar} />
				<div className="name">{ accountWithToots.acct }</div>
				<div>{ accountWithToots.toots.length}</div>
			</div>
			<div className={`toots ${clsShow}`}>
				{
					accountWithToots.toots.map( ( t, i ) => <Toot key={ i } toot={ t } /> )
				}
			</div>
		</div>
	)
}
