import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.clickmanager.tvplayer"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.clickmanager.tvplayer"
        minSdk = 23
        targetSdk = 35
        // O APK 0.1.0 (versionCode 1) já foi distribuído diretamente.
        // A primeira versão da Play precisa ser superior para atualizar essas instalações.
        versionCode = providers.environmentVariable("CLICKTV_VERSION_CODE")
            .orNull
            ?.toIntOrNull()
            ?: 5
        versionName = "1.0.3"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables.useSupportLibrary = true
    }

    flavorDimensions += "environment"
    productFlavors {
        create("development") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            buildConfigField("String", "DEFAULT_PLAYER_URL", "\"\"")
            buildConfigField("boolean", "ALLOW_CLEARTEXT", "true")
        }
        create("homologation") {
            dimension = "environment"
            applicationIdSuffix = ".hml"
            versionNameSuffix = "-hml"
            buildConfigField(
                "String",
                "DEFAULT_PLAYER_URL",
                "\"https://tv-hml.clickmanager.com.br\""
            )
            buildConfigField("boolean", "ALLOW_CLEARTEXT", "false")
        }
        create("production") {
            dimension = "environment"
            buildConfigField(
                "String",
                "DEFAULT_PLAYER_URL",
                "\"https://tv.clickmanager.com.br\""
            )
            buildConfigField("boolean", "ALLOW_CLEARTEXT", "false")
        }
    }

    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("CLICKTV_KEYSTORE_PATH")
            val keystorePassword = System.getenv("CLICKTV_KEYSTORE_PASSWORD")
            val keyAliasValue = System.getenv("CLICKTV_KEY_ALIAS")
            val keyPasswordValue = System.getenv("CLICKTV_KEY_PASSWORD")

            if (!keystorePath.isNullOrBlank()) {
                storeFile = file(keystorePath)
                storePassword = keystorePassword
                keyAlias = keyAliasValue
                keyPassword = keyPasswordValue
            }
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            ndk.debugSymbolLevel = "SYMBOL_TABLE"
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }

    testOptions {
        unitTests.isIncludeAndroidResources = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget = JvmTarget.JVM_17
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.webkit)
    implementation(libs.kotlinx.coroutines.android)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.foundation)

    debugImplementation(libs.compose.ui.tooling)
    debugImplementation(libs.compose.ui.test.manifest)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.espresso.core)
    androidTestImplementation(platform(libs.compose.bom))
    androidTestImplementation(libs.compose.ui.test.junit4)
}
