<div align="center">

# Physique Flash

**60 secondes. Trajectoires et vitesse.**

Arcade de physique 6ème dans le navigateur. Rien n'est envoyé.

</div>

Borne d'arcade, petite sœur de [calcul-flash](https://github.com/fschmutz/calcul-flash). Prénom, puis
entraînement / niveau / durée. Manche chronométrée, séries à multiplicateur, récap de fin de manche,
**Rejouer les erreurs** qui repasse exactement les questions ratées. Tout en français, tout hors ligne.

Le programme vient des deux fiches de 6ème du Collège Provence : *Activité 1 — Les trajectoires à Marseille*
et *Activité 2 — Vitesse lors d'un match au stade Vélodrome*. Un cran au-dessus de la fiche : c'est de
l'entraînement, pas une recopie.

## Entraînements

| Mode | Ce qu'on révise | Comment on répond |
| --- | --- | --- |
| `traj` | Classer une situation : rectiligne, circulaire, quelconque (curviligne), ou rectiligne puis circulaire. Forme de la trajectoire, définitions, intrus. | Boutons à toucher, pavé masqué |
| `vitesse` | `V = d / t` dans les trois sens (`V`, `d`, `t`), en m/s et en km/h, durées en minutes à convertir, comparer deux vitesses, grandeurs et matériel à mesurer. | Nombre tapé, QCM quand le choix *est* la question |
| `conv` | Par cœur : km → m (×1000), h → s (×3600), min → s (×60), min → h (0,25 / 0,5 / 0,75), km/h ↔ m/s (÷ 3,6). | Nombre tapé, QCM pour les facteurs |
| `mix` | Les trois, sans prévenir. | Les deux |

Trois niveaux (Tranquille / 6ème / Expert), cinq paliers qui montent avec les séries, manches de 45 s, 60 s
ou 2 min. Les énoncés s'écrivent à la française (`1,5 h`) et le pavé accepte la virgule comme le point.

## Vie privée

Pas de compte, pas de réseau, pas d'analytics, pas de police distante. Seuls le prénom et les records locaux
vont dans `localStorage`. La CSP est `default-src 'self'`. Les polices sont celles du système.

## En local

```bash
python3 -m http.server 8080
# http://localhost:8080
```

```bash
node --test "test/*.test.mjs"
```

Les tests vérifient les générateurs sans navigateur : chaque réponse tapée est recalculée à partir de
l'énoncé affiché par une table de conversion écrite séparément (`test/expected.mjs`), chaque QCM a exactement
une bonne option, et aucun énoncé ne se répète dans la fenêtre de mémoire du distributeur.

## GitHub Pages

Site statique servi depuis la racine de `main`, comme `calcul-flash` : pas de build, pas de workflow, juste
`.nojekyll`. La page ne sera en ligne qu'après fusion, et une fois Pages activé sur le dépôt
(*Settings → Pages → Deploy from a branch → `main` / `/`*).

Si la page semble vieille après une mise à jour, touchez **Recharger la dernière version** en bas : le service
worker garde sinon l'ancienne version.

## Licence

MIT. Copyright (c) 2026 [Falco Schmutz](https://github.com/fschmutz).
