package main

import (
	"bufio"
	"database/sql"
	"fmt"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
	"os"
	"strings"
)

type query struct {
	Query   string `json:"query"`
	Exclude string `json:"exclude"`
}

type results struct {
	Results []string `json:"results"`
}

var db *sql.DB

func main() {
	router := gin.Default()
	router.SetTrustedProxies(nil)
	router.POST("/search", postQuery)

	var err error
	db, err = sql.Open("sqlite3", "file::memory:?cache=shared")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	_, err = db.Exec("create table words (c1 text, c2 text, c3 text, c4 text, c5 text, c6 text)")
	if err != nil {
		log.Fatal(err)
	}

	file, err := os.Open("words")
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		word := scanner.Text()
		if len(word) == 5 {
			_, err := db.Exec(
				`INSERT INTO words (c1,c2,c3,c4,c5,c6) VALUES (?, ?, ?, ?, ?, NULL)`,
				string(word[0]), string(word[1]), string(word[2]),
				string(word[3]), string(word[4]),
			)
			if err != nil {
				log.Fatal(err)
			}
		} else if len(word) == 6 {
			_, err := db.Exec(
				`INSERT INTO words (c1,c2,c3,c4,c5,c6) VALUES (?, ?, ?, ?, ?, ?)`,
				string(word[0]), string(word[1]), string(word[2]),
				string(word[3]), string(word[4]), string(word[5]),
			)
			if err != nil {
				log.Fatal(err)
			}
		}
	}

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}

	router.Run("localhost:8080")
}

func postQuery(c *gin.Context) {
	var newQuery query

	if err := c.BindJSON(&newQuery); err != nil {
		return
	}

	results, err := performQuery(newQuery)
	if err != nil {
		log.Fatal(err)
	}

	c.IndentedJSON(http.StatusOK, results)
}

func performQuery(q query) (results, error) {
	if len(q.Query) < 5 || len(q.Query) > 6 {
		return results{}, nil
	}

	where := []string{}
	args := []any{}

	for i, ch := range q.Query {
		col := fmt.Sprintf("c%d", i+1)
		if ch == '.' {
			if q.Exclude != "" {
				placeholders := make([]string, len(q.Exclude))
				for j := range q.Exclude {
					placeholders[j] = "?"
					args = append(args, string(q.Exclude[j]))
				}
				where = append(where, fmt.Sprintf("%s NOT IN (%s)", col, strings.Join(placeholders, ",")))
			}
		} else {
			where = append(where, fmt.Sprintf("%s = ?", col))
			args = append(args, string(ch))
		}
	}

	// Enforce correct length
	if len(q.Query) == 5 {
		where = append(where, "c6 IS NULL")
	} else {
		where = append(where, "c6 IS NOT NULL")
	}

	sqlQuery := "SELECT c1,c2,c3,c4,c5,c6 FROM words"
	if len(where) > 0 {
		sqlQuery += " WHERE " + strings.Join(where, " AND ")
	}

	rows, err := db.Query(sqlQuery, args...)
	if err != nil {
		return results{}, err
	}
	defer rows.Close()

	r := []string{}
	for rows.Next() {
		var w [6]sql.NullString
		if err := rows.Scan(&w[0], &w[1], &w[2], &w[3], &w[4], &w[5]); err != nil {
			return results{}, err
		}

		// Build the word only from valid columns
		word := ""
		for i := 0; i < len(q.Query); i++ {
			if w[i].Valid {
				word += w[i].String
			}
		}
		r = append(r, word)
	}

	return results{Results: r}, nil
}
