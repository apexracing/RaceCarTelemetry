'use strict'
/* eslint-disable */
import {
	app,
	BrowserWindow,
	Tray,
	Menu
} from 'electron'
import config from '../../package.json'

const path = require('path')
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
	global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let tray = null // 托盘
const winURL = process.env.NODE_ENV === 'development' ?
	`http://localhost:9080` :
	`file://${__dirname}/index.html`

function createWindow() {
	/**
	 * Initial window options
	 */
	mainWindow = new BrowserWindow({
		height: 768,
		useContentSize: false,
		width: 1024,
		webPreferences: {
			webSecurity: false,
			enableRemoteModule: true
		}
	})
	mainWindow.setResizable(true)
	mainWindow.loadURL(winURL)
	// 关闭
	mainWindow.on('close', (event) => {
		mainWindow.hide()
		mainWindow.setSkipTaskbar(true)
		event.preventDefault()
	})

	mainWindow.on('show', () => {
		tray.setHighlightMode('always')
		// dialog.showErrorBox('一条信息', '页面展示')
	})

	mainWindow.on('restore', () => {
		tray.setImage(path.join(__static, './' + config.name + '.ico'))
	})
	// 隐藏
	mainWindow.on('hide', () => {
		tray.setHighlightMode('always')
	})
	// 托盘
	tray = new Tray(path.join(__static, '/' + config.name + '.ico'))
	const contextMenu = Menu.buildFromTemplate([{
		label: '退出',
		click: () => {
			mainWindow.webContents.send('main-process-messages', 'exit')
			setTimeout(function() {
				mainWindow.destroy()
			}, 300)
		}
	}])
	tray.setToolTip(config.name)
	tray.setContextMenu(contextMenu)
	tray.on('click', () => {
		if (mainWindow.isVisible()) {
			if (mainWindow.isMinimized()) {
				mainWindow.show()
			}
		} else {
			mainWindow.show()
			mainWindow.setSkipTaskbar(false)
		}
	})
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow()
	}
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
autoUpdater.quitAndInstall()
})

app.on('ready', () => {
if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
*/
