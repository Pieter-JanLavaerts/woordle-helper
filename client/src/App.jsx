import { useState } from 'react'
import './App.css'
import axios from 'axios';

function App() {
    const [keys, setKeys] = useState(Array(26).fill(false));
    const [query, setQuery] = useState('');
    const [include, setInclude] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    function Key({ clicked, onKeyClick, display }) {
        return (
            <button className={clicked ? "key clicked" : "key"} onClick={onKeyClick}>
                {display}
            </button>
        );
    }

    function buttonPress(i) {
        const nextKeys = keys.slice();
        nextKeys[i] = !nextKeys[i];
        setKeys(nextKeys);
    }

    const keyButtons = keys.map((value, index) => <Key
        clicked={value}
        onKeyClick={() => buttonPress(index)}
        display={keyIndexToLetter(index)}
    />);

    const resultsView = results.map((value) => <button>{value}</button>)

    function handleQueryChange(e) {
        setQuery(e.target.value);
    }

    function handleIncludeChange(e) {
        setInclude(e.target.value);
    }

    function keyIndexToLetter(index) {
        return "qwertyuiopasdfghjklzxcvbnm"[index]
    }

    function onSearch() {
        const safeQuery = query.trim();
        if (safeQuery.length < 5) {
            setError('Groene letters moeten 5 tekens bevatten.');
            setResults([]);
            return;
        }

        setError('');
        const exclude = keys.map((value, index) => {
            if (value) {
                return index;
            } else {
                return -1;
            }
        }).filter((value) => value !== -1)
            .map(keyIndexToLetter).join()

        axios.post('/search', {
            query: safeQuery,
            exclude: exclude,
            include: include
        }).then(function(response) {
            setResults(response.data.results)
        }).catch(function() {
            setError('Zoeken mislukt. Controleer je invoer en probeer opnieuw.');
        })
    }

    return (
        <div className="helper-box">
            <h1>Woordle helper</h1>
            <label>
                Groene letters: <input className="boxed-input" maxLength="5" onChange={handleQueryChange} />
            </label>
            <label>
                Gele letters: <input className="boxed-input" maxLength="5" onChange={handleIncludeChange} />
            </label>
            <div className="keyboard">
                {keyButtons}
            </div>
            <button onClick={onSearch}>Zoeken</button>
            {error && <div className="error">{error}</div>}
            <div className="results">
                {resultsView}
            </div>
        </div>
    )
}

export default App
