package net.taptappun.taku.kobayashi.androidscreenrecord

import android.annotation.SuppressLint
import android.app.*
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.MediaRecorder
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import android.provider.MediaStore
import android.util.Log
import androidx.annotation.RequiresApi
import java.io.FileDescriptor

// 参考: https://takusan23.github.io/Bibouroku/2020/04/06/MediaProjection/
class ScreenRecordService : Service() {
    //画面録画で使う
    lateinit var mediaRecorder: MediaRecorder
    lateinit var projectionManager: MediaProjectionManager
    lateinit var projection: MediaProjection
    lateinit var virtualDisplay: VirtualDisplay
    lateinit var imageReader: ImageReader

    override fun onBind(intent: Intent?): IBinder? {
        Log.d(MainActivity.TAG, "onBind")
        return null
    }

    override fun onStartCommand(intent: Intent, flags: Int, startId: Int): Int {
        Log.d(MainActivity.TAG, "onStartCommand")
        //通知を出す。
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notificationBuilder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            //通知チャンネル
            val channelID = "rec_notify"
            //通知チャンネルが存在しないときは登録する
            if (notificationManager.getNotificationChannel(channelID) == null) {
                val channel = NotificationChannel(
                    channelID,
                    "録画サービス起動中通知",
                    NotificationManager.IMPORTANCE_HIGH
                )
                notificationManager.createNotificationChannel(channel)
            }
            Notification.Builder(applicationContext, channelID)
        }else{
            Notification.Builder(applicationContext)
        }
        //通知作成

        val notification = notificationBuilder
            .setContentText("録画中です。")
            .setContentTitle("画面録画")
            .build()

        startForeground(1, notification)
        startRec(intent)
        return START_NOT_STICKY
    }

    //録画開始
    @SuppressLint("WrongConstant")
    private fun startRec(intent: Intent) {
        val data: Intent? = intent.getParcelableExtra("data")
        val code = intent.getIntExtra("code", Activity.RESULT_OK)
        //画面の大きさ
        val height = intent.getIntExtra("height", 1000)
        val width = intent.getIntExtra("width", 1000)
        val dpi = intent.getIntExtra("dpi", 1000)
        if(data != null) {
            projectionManager =
                getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            // Service上でMediaProjectionを行う場合AndroidMannifest.xmlで以下の項目をいれないとエラーが発生しちゃう
            // android:foregroundServiceType="mediaProjection"
            // 参考: https://stackoverflow.com/questions/61276730/media-projections-require-a-foreground-service-of-type-serviceinfo-foreground-se

            //codeはActivity.RESULT_OKとかが入る。
            projection = projectionManager.getMediaProjection(code, data)
            imageReader = ImageReader.newInstance(width , height, PixelFormat.RGBA_8888, 2)
            imageReader.setOnImageAvailableListener(imageReaderListener, null)

            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(this)
            }else{
                MediaRecorder()
            }
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC)
            mediaRecorder.setVideoSource(MediaRecorder.VideoSource.SURFACE)
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            mediaRecorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264)
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB)
            mediaRecorder.setVideoEncodingBitRate(1080 * 10000) //1080は512ぐらいにしといたほうが小さくできる
            mediaRecorder.setVideoFrameRate(30)
            mediaRecorder.setVideoSize(width, height)
            mediaRecorder.setAudioSamplingRate(44100)
            val fileDescriptor = getWillSaveFileDescriptor()
            mediaRecorder.setOutputFile(fileDescriptor)
            // surfaceをいれるためにはMediaCodicで録画できるように試みる必要がある
            // https://developer.android.com/reference/android/media/MediaCodec
            // じゃないと java.lang.IllegalArgumentException: not a PersistentSurface というエラーが出る
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
//                mediaRecorder.setInputSurface(imageReader.surface)
            }
            mediaRecorder.prepare()

            // DISPLAYMANAGERの仮想ディスプレイ表示条件
            // VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR	コンテンツをミラーリング表示する
            // VIRTUAL_DISPLAY_FLAG_OWN_CONTENT_ONLY	独自のコンテンツを表示。ミラーリングしない
            // VIRTUAL_DISPLAY_FLAG_PRESENTATION	プレゼンテーションモード
            // VIRTUAL_DISPLAY_FLAG_PUBLIC	HDMIやWirelessディスプレイ
            // VIRTUAL_DISPLAY_FLAG_SECURE	暗号化対策が施されたセキュアなディスプレイ
            // https://techbooster.org/android/application/17026/
            virtualDisplay = projection.createVirtualDisplay(
                "recode",
                width,
                height,
                dpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
//                mediaRecorder.surface,
                imageReader.surface,
                object : VirtualDisplay.Callback() {
                    override fun onPaused() {
                        Log.d(MainActivity.TAG, "VirtualDisplay onPaused")
                    }

                    override fun onResumed(){
                        Log.d(MainActivity.TAG, "VirtualDisplay onResumed")
                    }

                    override fun onStopped(){
                        Log.d(MainActivity.TAG, "VirtualDisplay onStopped")
                    }
                 },
                null
            )

            //開始
            mediaRecorder.start()
        }
    }

    //録画止める
    private fun stopRec() {
        // 何にも録画していないのにstartしているとstopの時に stop failed. というエラーが出ちゃう
        //mediaRecorder.stop()
        mediaRecorder.release()
        imageReader.close()
        virtualDisplay.release()
        projection.stop()
    }

    private val imageReaderListener = ImageReader.OnImageAvailableListener { reader: ImageReader ->
        val image = reader.acquireLatestImage()
        Log.d(MainActivity.TAG, "width:${image.width} height:${image.height} planeSize:${image.planes.size}")
        for(imagePlane in image.planes) {
            Log.d(MainActivity.TAG, "rowStride:${imagePlane.rowStride} pixelStride:${imagePlane.pixelStride}")
        }
        image.close()
    }

    //保存先取得。今回は対象範囲別ストレージに保存する
    // API Level 29からの新しい動画ファイルの保存方法を実装するとこうなった
    // https://star-zero.medium.com/android-q%E3%81%AEscoped-storage%E3%81%AB%E3%82%88%E3%82%8B%E5%A4%89%E6%9B%B4-afe41cde9f35
    private fun getWillSaveFileDescriptor(): FileDescriptor {
        val resolver = applicationContext.contentResolver
        // Find all audio files on the primary external storage device.
        val videoCollection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            MediaStore.Video.Media.getContentUri(
                MediaStore.VOLUME_EXTERNAL_PRIMARY
            )
        } else {
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI
        }
        val videoDetails = ContentValues()
        videoDetails.put(MediaStore.Video.Media.DISPLAY_NAME, "${System.currentTimeMillis()}.mp4")
        val videoContentUri = resolver.insert(videoCollection, videoDetails)
        val parcelFileDescriptor = resolver.openFileDescriptor(videoContentUri!!, "rw");
        return parcelFileDescriptor!!.fileDescriptor
    }

    //Service終了と同時に録画終了
    override fun onDestroy() {
        super.onDestroy()
        Log.d(MainActivity.TAG, "onDestroy")
        stopRec()
    }
}