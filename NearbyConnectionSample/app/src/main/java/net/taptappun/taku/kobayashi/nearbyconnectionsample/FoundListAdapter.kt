package net.taptappun.taku.kobayashi.nearbyconnectionsample

import android.app.Activity
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.Button
import android.widget.TextView
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo

class FoundListAdapter(private val activity: Activity) : BaseAdapter() {

    private val foundEndpointInfo = mutableMapOf<String, DiscoveredEndpointInfo>()
    private val foundEndpointIds = mutableListOf<String>()
    private var connectionListener: ((String, DiscoveredEndpointInfo) -> Unit)? = null

    fun putFoundEndpoint(endpoint: String, endpointInfo: DiscoveredEndpointInfo){
        if(!foundEndpointInfo.contains(endpoint)){
            foundEndpointInfo[endpoint] = endpointInfo
            foundEndpointIds.add(endpoint)
            this.notifyDataSetChanged()
        }
    }

    fun removeFoundEndpoint(endpoint: String){
        foundEndpointInfo.remove(endpoint)
        foundEndpointIds.remove(endpoint)
        this.notifyDataSetChanged()
    }

    fun setConnectionListener(listener: ((String, DiscoveredEndpointInfo) -> Unit)){
        connectionListener = listener
    }

    override fun getCount(): Int {
        return foundEndpointIds.size;
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
            mainConvertView = activity.layoutInflater.inflate(R.layout.found_info_list_cell, null)
        }
        val foundEndpointId = foundEndpointIds[position]
        val foundEndpointInfo = foundEndpointInfo[foundEndpointId]
        val nicknameTextview = mainConvertView!!.findViewById<TextView>(R.id.nicknameTextview)
        nicknameTextview.text = foundEndpointInfo?.endpointName.toString()
        val endpointTextview = mainConvertView.findViewById<TextView>(R.id.endpointTextview)
        endpointTextview.text = foundEndpointId
        val connectionButton = mainConvertView.findViewById<Button>(R.id.connectionButton)
        connectionButton.setOnClickListener {
            if (foundEndpointInfo != null) {
                connectionListener?.let { it -> it(foundEndpointId, foundEndpointInfo) }
            }
        }
        return mainConvertView
    }
}