# A Casa 
> Experiência interativa com 2 módulos de interface;
> 
> [2d - Experiência como acesso de arquvivos] & [3d - Experiência com visualização real]
## Tecnologias

- HTML
- CSS
- JavaScript
- Three.js

## Modo de apresentação

Abra `projeto/interfaces/3d/index.html?apresentacao=1` por um servidor HTTP
para habilitar atalhos exclusivos de demonstração:

- `1` Cozinha; `2` Corredor; `3`–`6` Salas A–D; `7` Sala Final;
- `8` Sala Dino; `L` inicia a reconstrução na Sala Final;
- `T` abre/fecha o painel técnico de observabilidade;
- `R` reinicia a experiência e zera o estado da sessão.

Sem `?apresentacao=1`, os atalhos, o indicador e a API
`window.__apresentacao` não são criados.

## Memória da sessão

A experiência 3D mantém em memória um log semântico de entradas, interações,
transições, Vestígios e rota. Esse estado altera discretamente os ambientes e
alimenta a reconstrução física disponível na Sala Final. Nada é persistido:
recarregar a página inicia outra sessão.

Na Sala Final, um terminal de observação recompõe essa memória sobre uma
maquete holográfica da House, sem substituir o modo técnico.

Na Cozinha, uma miniatura quase sob o banco leste aciona a estante doméstica e
revela o acesso opcional ao Ambiente não catalogado. Esse desvio não altera
rota, Vestígios nem dossiê e retorna à própria Cozinha.
