package net.taptappun.taku.kobayashi.mlkitsample

import com.google.android.gms.tasks.Task
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions

class BarcodeImageDetector : ImageDetector<Barcode>() {
    override public fun detect(image: InputImage): Task<MutableList<Barcode>> {
        // [START set_detector_options]
        // Format: https://zenn.dev/mochico/articles/0c1f1104852659
        // https://developers.google.com/ml-kit/vision/barcode-scanning/android
        /*
        val options = BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_QR_CODE,
                Barcode.FORMAT_AZTEC)
            .build()
        */
        // [END set_detector_options]

        // [START get_detector]
        val scanner = BarcodeScanning.getClient()
        // Or, to specify the formats to recognize:
//        val scanner = BarcodeScanning.getClient(options)
        // [END get_detector]

        // [START run_detector]
        return scanner.process(image)
    }
}