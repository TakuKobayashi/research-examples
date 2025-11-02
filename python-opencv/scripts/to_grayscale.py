import sys
import cv2

im = cv2.imread(sys.argv[1])
im_gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
cv2.imwrite(sys.argv[2], im_gray)