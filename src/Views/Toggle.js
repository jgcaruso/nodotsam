import { Fragment } from 'preact'
import { useState } from 'preact/hooks'

export default function Toggle( { toggleId, onChange, children } ) {
	const [ enabled, setEnabled ] = useState( false )

	const handleToggle = () => {
		const newValue = ! enabled
		setEnabled( newValue )

		onChange && onChange( newValue )
	}

	return (
		<>
			<label for={ toggleId } className={ `toggle ${ enabled ? 'enabled' : '' }` }>{ children }</label>
			<input id={ toggleId } type='checkbox' className="toggleInput" onChange={ handleToggle } />
		</>
	)
}
