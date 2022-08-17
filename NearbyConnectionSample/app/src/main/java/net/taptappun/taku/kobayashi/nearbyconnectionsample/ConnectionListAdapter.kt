package net.taptappun.taku.kobayashi.nearbyconnectionsample

import android.app.Activity
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import com.google.android.gms.nearby.connection.PayloadTransferUpdate

class ConnectionListAdapter(private val activity: Activity) : BaseAdapter() {

    private val connectionIdNickname = mutableMapOf<String, String>()
    private val connectionIds = mutableListOf<String>()
    private val connectionIdCellview = mutableMapOf<String, View>()
    private var sendDataListener: ((String, String) -> Unit)? = null

    fun putConnectionInfo(endpoint: String, nickname: String){
        if(!connectionIdNickname.contains(endpoint)){
            connectionIdNickname[endpoint] = nickname
            connectionIds.add(endpoint)
            this.notifyDataSetChanged()
        }
    }

    fun removeConnectionInfo(endpoint: String){
        connectionIdNickname.remove(endpoint)
        connectionIds.remove(endpoint)
        connectionIdCellview.remove(endpoint)
        this.notifyDataSetChanged()
    }

    fun setSendingProgress(endpointId: String, progressStatus: Int, inprogressValue: Int, maxValue: Int){
        val mainConvertView = connectionIdCellview[endpointId]
        if(mainConvertView != null){
            val connectionButton = mainConvertView.findViewById<Button>(R.id.sendDataButton)
            val sendingProgressBar = mainConvertView.findViewById<ProgressBar>(R.id.sendingProgressBar)
            if(progressStatus == PayloadTransferUpdate.Status.IN_PROGRESS){
                sendingProgressBar.visibility = View.VISIBLE
                connectionButton.visibility = View.INVISIBLE
                sendingProgressBar.max = maxValue
                sendingProgressBar.progress = inprogressValue
            } else {
                sendingProgressBar.visibility = View.INVISIBLE
                connectionButton.visibility = View.VISIBLE
            }
        }
    }

    fun setSendDataListener(listener: ((String, String) -> Unit)){
        sendDataListener = listener
    }

    override fun getCount(): Int {
        return connectionIds.size;
    }

    override fun getItem(position: Int): Any {
        return position
    }

    override fun getItemId(position: Int): Long {
        return position.toLong()
    }

    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
        var mainConvertView = convertView
        if (mainConvertView == null) {
            mainConvertView = activity.layoutInflater.inflate(R.layout.connection_list_cell, null)
        }
        val connectionId = connectionIds[position]
        val nickname = connectionIdNickname[connectionId]
        connectionIdCellview[connectionId] = mainConvertView!!
        val nicknameTextview = mainConvertView!!.findViewById<TextView>(R.id.connectedNicknameTextview)
        nicknameTextview.text = nickname.toString()
        val endpointTextview = mainConvertView.findViewById<TextView>(R.id.connectedEndpointTextview)
        endpointTextview.text = connectionId
        val connectionButton = mainConvertView.findViewById<Button>(R.id.sendDataButton)
        connectionButton.setOnClickListener {
            if (nickname != null) {
                sendDataListener?.let { it -> it(connectionId, nickname) }
            }
        }
        return mainConvertView
    }
}