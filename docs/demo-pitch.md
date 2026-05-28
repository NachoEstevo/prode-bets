# Prode Bets Demo Pitch

Prode Bets es una capa de navegador para momentos de futbol en vivo.

Durante un partido, la informacion esta fragmentada: el marcador esta en ESPN, las probabilidades estan en Polymarket, y la conversacion pasa en Twitter o en grupos de amigos.

Nuestra demo une esas capas en un overlay.

Hoy usamos un partido real: Republic of Ireland vs Qatar, 28 de mayo de 2026. Tomamos el estado en vivo desde ESPN y lo conectamos con probabilidades reales de Polymarket, como victoria de Irlanda o empate.

La extension puede aparecer sobre cualquier pagina y, cuando detecta contexto futbolero, muestra el partido, el mercado y una capa social tipo prode.

Importante: no ejecutamos trades. Es read-only y abre Polymarket por fuera.

Para el Mundial, esto se vuelve un companero contextual para cada partido: datos en vivo, sentimiento de mercado y predicciones sociales, directo donde los fans ya estan.

Prode Bets es como Clippy para mercados de futbol, pero con datos reales.

## Demo Data Sources

- FAI: https://www.fai.ie/latest/match-preview-republic-ireland-v-qatar-experienced-xi-set-friendly/
- Aviva Stadium: https://www.avivastadium.ie/whats-on/fai-international-friendly-republic-of-ireland-v-qatar
- BBC Sport: https://www.bbc.co.uk/sport/football/live/cz02e105m21t
- ESPN public scoreboard endpoint: https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.friendly/scoreboard?dates=20260528
- Polymarket Gamma public search: https://gamma-api.polymarket.com/public-search?q=ireland%20qatar
