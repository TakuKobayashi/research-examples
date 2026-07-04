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

im_gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
cv2.imwrite(sys.argv[2], im_gray)