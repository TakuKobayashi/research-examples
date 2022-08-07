package net.taptappun.taku.kobayashi.mlkitsample

import com.google.android.gms.tasks.Task
import com.google.mlkit.vision.common.InputImage

abstract class ImageDetector<T> {
    abstract fun detect(image: InputImage): Task<MutableList<T>>
}