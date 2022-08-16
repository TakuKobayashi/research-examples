package net.taptappun.taku.kobayashi.nearbyconnectionsample

import android.app.Activity
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.Button
import android.widget.TextView

class ConnectionListAdapter(private val activity: Activity) : BaseAdapter() {

    private val connectionIdNickname = mutableMapOf<String, String>()
    private val connectionIds = mutableListOf<String>()
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
        this.notifyDataSetChanged()
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