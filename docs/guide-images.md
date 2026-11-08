# 顾客指南图片维护

两张图已替换为真实感操作特写加可编辑文字，沿用站点莓紫与奶白色。特写由内置 imagegen 生成，是教学示意素材，并非品牌实拍或顾客照片。

## 文件

- `public/site/guides/how-to-apply.svg`：四步贴戴。
- `public/site/guides/measure-nail-width.svg`：绕纸条、标边缘、展平读数。
- `public/site/guides/photos/application.jpg`：贴戴特写源图，四等分 2×2 排列。
- `public/site/guides/photos/measurement.jpg`：测量特写源图，三等分水平排列。
- `scripts/build-nail-guides.mjs`：文字、配色、版式和照片裁切位置的可维护源文件。

## 怎么编辑

SVG 的标题、步骤、颜色和布局是矢量元素；特写是嵌入的 JPEG 图层，不能像矢量路径一样修改手指形状。SVG 内嵌完整照片，不依赖外部图片地址，可单独发送或打开。

直接修改 SVG：用支持 SVG 的设计软件打开，或在 VS Code 中搜索 `<text>` 修改文字、搜索颜色代码修改配色。图片数据位于 `defs` 内，不要手动改动长串 `data:image/jpeg;base64`。

持续维护推荐编辑 `scripts/build-nail-guides.mjs` 的步骤文案和位置参数，再运行：

```sh
node scripts/build-nail-guides.mjs
```

该命令会覆盖两张 SVG。先前直接在 SVG 做的手动修改不会自动同步回脚本，因此应选择一种维护方式；直接编辑 SVG 后不要随意重生成。运行前保留 Git 中的改动记录。

替换照片时，保留源图名称和布局：贴戴图为 2×2，测量图为 1×3。替换 JPEG 后运行同一命令，照片会重新嵌入 SVG。更改拼图布局时，需一并修改脚本中的裁切参数。

网页详细文字仍在 `content/pages/how-to-apply.md` 与 `content/pages/size-guide.md`，修改网页文字不会自动修改图片内的文字。

## 图像生成提示词

使用内置 imagegen，两张照片分别生成；文字由 SVG 排版，没有交给图像模型渲染。重新生成时重点检查手指结构、胶水位置、纸条方向和两侧标记位置；测量图仅示范方法，不使用照片中的尺子作为真实比例尺。

### 贴戴特写

```text
Use case: scientific-educational. Create a premium editorial beauty PHOTOGRAPHIC contact sheet for a handmade press-on nail brand. Exactly 4 equal-sized rectangular photos in a precise 2 by 2 grid, no gaps or borders, canvas landscape 3:2. NO TEXT, NO NUMBERS, NO LETTERING, NO LOGOS. Each photo has warm ivory background, soft neutral daylight, real natural skin texture, graceful anatomically correct adult woman's hands, short clean oval nude natural nails and short almond blush press-on nails. Skin and nail anatomy must be immaculate. Crops show just the few fingertips needed, never whole hands or distracting accessories. Each quadrant a distinct unambiguous tutorial shot: top-left shows an alcohol pad held in one hand wiping the bare index fingernail of the other hand; top-right shows a loose blush press-on nail held by thumb and forefinger aligned directly over a natural fingernail, dry fit with nail bed visible and 3 loose tips on background; bottom-left shows a tiny nail glue bottle nozzle angled towards the UNDERSIDE of a single loose press-on held between fingers, clear one small dot of glue inside, background minimal; bottom-right shows another finger gently pressing a blush press-on nail down onto a fingernail, actual pad-on-nail contact, no impossible bent fingers. All four photos same adult, same style and same camera distance, plenty of breathing room, practical authentic manicure instruction, no illustration or fake vector icons. Each photo composition self-contained and centered in its quadrant; do not allow any object to cross quadrant boundaries.
```

### 测量特写

```text
Use case: scientific-educational. Create premium editorial beauty PHOTOGRAPHIC three-step tutorial image, exactly THREE equal-width photographs arranged left-to-right edge-to-edge in a single horizontal triptych, wide canvas 3:1 ratio. NO TEXT, NO NUMBERS OR PRINTED RULER GRADUATION DIGITS, NO LOGOS. Same adult woman's natural short oval fingernail, ivory tabletop, natural skin texture, soft daylight; elegant restrained professional ecommerce instructional photography, anatomically correct hands, no extra fingers. LEFT photo: close-up top view of adult index fingertip pointing up, natural nail in focus, a thin white flexible paper strip lying SIDEWAYS across widest part of the natural nail and curving along nail surface, one hand holds strip ends. MIDDLE photo: same paper strip across nail, two small distinct dark ink marks on the strip exactly at the left and right sidewalls of the nail; a fine pencil tip touching one mark and hand holding strip, demonstrate marking nail width. RIGHT photo: paper strip removed from nail, now lying flat directly above a stainless millimeter ruler, two dark marks aligned to millimeter ticks; only ruler fine tick marks (no numbers) and paper strip in focus, fingertips holding paper flat. Measurement is the SHORT SIDE-TO-SIDE WIDTH of the nail, never the long nail length. No diagrams, no arrows, no illustrations, no embedded captions. Identical exposure and color balance across all three photos, objects centered, clearly readable educational action.
```
