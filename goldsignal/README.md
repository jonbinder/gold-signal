# Gold Signal

Static website for gold signal stock data.

## Structure

```
goldsignal/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── data/
│   └── stocks.json
└── README.md
```

## Run locally

Serve the `goldsignal` folder with any static file server, for example:

```bash
npx serve goldsignal
```

Then open the URL shown in the terminal. Stock data is loaded from `data/stocks.json`.
