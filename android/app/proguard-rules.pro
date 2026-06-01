# Keep Capacitor classes and plugins
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# Keep all Cordova plugins and classes if Cordova is used
-keep class org.apache.cordova.** { *; }
-keep interface org.apache.cordova.** { *; }
-keep class * extends org.apache.cordova.CordovaPlugin { *; }

# Keep JavaScript interfaces (extremely critical for WebView JS bridges)
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line numbers and source files for clean crash traces
-keepattributes SourceFile,LineNumberTable

