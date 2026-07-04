import sys
import numpy as np
import cv2
import requests
from urllib.parse import urlparse

src = sys.argv[1]
if urlparse(src).scheme.startswith('http'):
  im = cv2.imdecode(np.array(bytearray(requests.get(src).content), dtype=np.uint8), -1)
else:
  im = cv2.imread(src)

jpg_quality1 = 95
jpg_quality2 = 90
tmp_src1 = "tmp_c95.jpg"
tmp_ela_src1 = "tmp_ela_c95.jpg"
# 違いを際立たせるために掛け算
scale = 15

cv2.imwrite(tmp_src1, im, [cv2.IMWRITE_JPEG_QUALITY, jpg_quality1])
tmp_img1 = cv2.imread(tmp_src1)
diff_img1 = scale * cv2.absdiff(im, tmp_img1)
cv2.imwrite(tmp_ela_src1, diff_img1, [cv2.IMWRITE_JPEG_QUALITY, jpg_quality1])