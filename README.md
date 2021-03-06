# Torcher

A simulator for light and vision inside a dark dungeon.

## Setup

- Open the map in a [graphics software](https://en.wikipedia.org/wiki/Graphics_software) such ad [GIMP](https://www.gimp.org/), [Photopea](https://www.photopea.com/) or [Photoshop](https://www.adobe.com/it/products/photoshop/free-trial-download.html) and remove all the sections that can be walked on by characters. Only the walls of the map should remain. Have the walls painted black, and the non-walls be transparent.
  - It is suggested to use the "Polygonal Lasso" Tool and to turn off Anti-alias.
  - Because of the nature of thhis image, it is suggested to dave it as a [.png](https://it.wikipedia.org/wiki/Portable_Network_Graphics) file.
- Configure you [settings](#settings) file.
- Start a web server on `.`

## Settings

The settings are loaded from `./settings.json`. The file contains the following fields:
| Field                   | Description                                                                                                                                                                     | Example                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| *map*                   | Filepath to the map image                                                                                                                                                       | `"path/to/map.jpg"`                                                          |
| *map_walls*             | Filepath to the map walls image                                                                                                                                                 | `"path/to/map_walls.png"`                                                    |
| *background_color*      | Color of the (walkable) map when non lit by light                                                                                                                               | `"#000000FF"`, `"#000000"`, ...                                              |
| *obfuscate_on_movement* | (Optional) If `true`, the terrain vision will only be updated when the token is released.<br />If `false`, the terrain vision follows the moving token. Defaults to `true`      | `true` \| `false`                                                            |
| *grid*                  | (Optional) Object to describe the grid that overlays the map                                                                                                                    |                                                                              |
| grid.*x*                | Horizontal displacement of the top-left corner of the grid                                                                                                                      | `15`, `0`, ...                                                               |
| grid.*y*                | Vertical displacement of the top-left corner of the grid                                                                                                                        | `15`, `0`, ...                                                               |
| grid.*widht*            | Width of the grid. Use `-1` to fill the canvas                                                                                                                                  | `1500`, `-1`, ...                                                            |
| grid.*height*           | Height of the grid. Use `-1` to fill the canvas                                                                                                                                 | `1500`, `-1`, ...                                                            |
| grid.*square_size*      | Side of the grid squares in pixels. 1 square = 5'                                                                                                                               | `30`, `25`, ...                                                              |
| grid.*snap_to_grid*     | Whether to confine the tokens fully inside a square of the grid or not                                                                                                          | `true` \| `false`                                                            |
| grid.*color*            | (Optional) Color of the grid. Defaults to `"#696969"`                                                                                                                           | `"#FFFFFFFF"`, `#505050`, ...                                                |
| *tokens*                | Array containing the list of tokens to add to the grid. Each element is an object described as follows                                                                          |                                                                              |
| token.*x*               | (Optional) The initial 0-based row in the grid. Defaults to `0`                                                                                                                 | `0`, `15`, ...                                                               |
| token.*y*               | (Optional) The initial 0-based column in the grid. Defaults to `0`                                                                                                              | `0`, `15`, ...                                                               |
| token.*size*            | (Optional) The size of the token as described in DnD5e. **Only works with medium**. Default to `"medium"`                                                                       | `"tiny"` \| `"small"` \| `"medium"` \| `"large` \| `"huge"` \| `"gargantuan"` |
| token.*color*           | (Optional) The color of the token. Defaults to `"#0F53BA"`                                                                                                                      | `"#FFFFFFFF"`, `#505050`, ...                                                |
| token.*light*           | (Optional) An array describing the radius of light emanating from the token. The first element is bright light, the second element is dim light in feet. Defaults to `[20, 20]` | `[20, 20]`, `[0, 0]`, ...                                                    |
| token.*darkVision*      | (Optional) Boolean describing if the token possesses Darkvision. Defaults to `false`                                                                                            | `true` \| `false`                                                            |
| token.*trueSight*       | (Optional) Boolean describing if the token possesses Truesight. Defaults to `false`                                                                                             | `true` \| `false`                                                            |
