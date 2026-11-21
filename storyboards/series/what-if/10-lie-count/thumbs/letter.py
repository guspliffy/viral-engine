"""Letters the two thumbnail stills (A/B test): big number tags over heads + 1-3 words in the top third.
    python3 storyboards/series/what-if/10-lie-count/thumbs/letter.py <out dir>"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
O = sys.argv[1]; F = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
def shadow(im, fn):
    m = Image.new('L', im.size, 0); fn(ImageDraw.Draw(m)); m = m.filter(ImageFilter.GaussianBlur(12))
    im.paste((15, 8, 8), (0, 0), m)
def tag(im, cx, cy, text, bg, size=150):
    f = ImageFont.truetype(F, size); d = ImageDraw.Draw(im)
    w = d.textlength(text, font=f); pw, ph = w + size * 0.7, size * 1.25
    box = [cx - pw / 2, cy - ph / 2, cx + pw / 2, cy + ph / 2]
    shadow(im, lambda dd: dd.rounded_rectangle([box[0] + 8, box[1] + 14, box[2] + 8, box[3] + 14], ph / 2, fill=170))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle(box, ph / 2, fill=bg, outline=(255, 255, 255), width=10)
    d.text((cx, cy + size * 0.02), text, font=f, fill=(255, 255, 255), anchor='mm')
def words(im, lines, x0, y, maxw, align='l'):
    for text, col, size in lines:
        while True:
            f = ImageFont.truetype(F, size); w = ImageDraw.Draw(im).textlength(text, font=f)
            if w <= maxw: break
            size -= 4
        x = x0 if align == 'l' else x0 - w / 2
        shadow(im, lambda dd: dd.text((x + 6, y + 12), text, font=f, fill=200, stroke_width=14, stroke_fill=200))
        ImageDraw.Draw(im).text((x, y), text, font=f, fill=col, stroke_width=12, stroke_fill=(28, 18, 22))
        y += int(size * 1.08)
RED, GREEN, WHITE, YEL = (214, 40, 40), (34, 150, 70), (255, 255, 255), (255, 214, 64)
JOBS = {
 'a': ('lc10-thumb-a-anime-pro-t0.50.png', 'lie-count-thumbnail-A', lambda im: (
     tag(im, *A_TAG, '215', RED, 170),
     words(im, [('MY BEST', WHITE, 150), ('FRIEND?!', YEL, 170)], 60, 40, 820))),
 'b': ('lc10-thumb-b-anime-pro-t0.50.png', 'lie-count-thumbnail-B', lambda im: (
     tag(im, *B_TAG1, '215', RED, 130), tag(im, *B_TAG2, '0', GREEN, 130),
     words(im, [('TRUST', WHITE, 130), ('WHO?', YEL, 150)], 1010, 50, 600, 'c'))),
}
A_TAG = (1160, 135); B_TAG1 = (545, 185); B_TAG2 = (1490, 235)
if __name__ == '__main__':
    for k, (src, name, job) in JOBS.items():
        im = Image.open(f'{O}/{src}').convert('RGB'); im.save(f'{O}/{name}-clean.jpg', quality=95)
        job(im); im.resize((1280, 720), Image.LANCZOS).save(f'{O}/{name}.jpg', quality=92); print(name)
