package com.minibudget.quicklog

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

/**
 * Quick Settings tile: a second entry point to the same log screen the notification's "Other" opens.
 * It reuses [DeepLink]; no parsing or inbox writing happens here, and it works without the foreground service.
 */
class LogTileService : TileService() {
  override fun onStartListening() {
    qsTile?.apply {
      state = Tile.STATE_INACTIVE // a launcher, not a toggle
      label = "Quick log"
      updateTile()
    }
  }

  override fun onClick() {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(DeepLink.log()))
      .setPackage(packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    if (Build.VERSION.SDK_INT >= 34) {
      val pending = PendingIntent.getActivity(this, 3, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      startActivityAndCollapse(pending)
    } else {
      @Suppress("DEPRECATION")
      startActivityAndCollapse(intent)
    }
  }
}
