import { useState } from 'react'
import './App.css'
import axios from 'axios';

function App() {
    const [keys, setKeys] = useState(Array(26).fill(false));
    const [query, setQuery] = useState(null);
    const [results, setResults] = useState([]);

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

    function keyIndexToLetter(index) {
        return "qwertyuiopasdfghjklzxcvbnm"[index]
    }

    function onSearch() {
        const exclude = keys.map((value, index) => {
            if (value) {
                return index;
            } else {
                return -1;
            }
        }).filter((value) => value !== -1)
            .map(keyIndexToLetter).join()

        axios.post('/search', {
            query: query,
            exclude: exclude
        }).then(function(response) {
            setResults(response.data.results)
        })
    }

    return (
        <div className="helper-box">
            <h1>Woordle helper</h1>
            <label>
                Groene letters: <input onChange={handleQueryChange} />
            </label>
            <div className="keyboard">
                {keyButtons}
            </div>
            <button onClick={onSearch}>Zoeken</button>
            <div className="results">
                {resultsView}
            </div>
        </div>
    )
}

export default App
