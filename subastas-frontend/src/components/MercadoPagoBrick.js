import React, { useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';

const MP_PUBLIC_KEY = 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

export default function MercadoPagoBrick({ onSubmit, usuarioEmail }) {
  const webViewRef = useRef(null);

  // We inject this HTML into the WebView
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://sdk.mercadopago.com/js/v2"></script>
        <style>
          body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          #cardPaymentBrick_container { margin-top: 20px; }
          #loading-info { color: #666; font-size: 16px; text-align: center; margin-top: 40px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div id="loading-info">Cargando formulario de Mercado Pago...</div>
        <div id="cardPaymentBrick_container"></div>
        <script>
          const mp = new MercadoPago('${MP_PUBLIC_KEY}', { locale: 'es-AR' });
          const bricksBuilder = mp.bricks();

          const renderCardPaymentBrick = async (bricksBuilder) => {
            const settings = {
              initialization: {
                amount: 100, // Required by MP for card Payment brick, even for tokenization
                payer: {
                  email: '${usuarioEmail || ""}',
                }
              },
              customization: {
                visual: {
                  texts: {
                    formSubmit: 'Guardar Tarjeta',
                  }
                }
              },
              callbacks: {
                onReady: () => {
                  document.getElementById('loading-info').style.display = 'none';
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
                },
                onSubmit: (cardFormData) => {
                  return new Promise((resolve, reject) => {
                    // Send token to React Native
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'submit', data: cardFormData }));
                    resolve();
                  });
                },
                onError: (error) => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error }));
                },
              },
            };
            window.cardPaymentBrickController = await bricksBuilder.create(
              'cardPayment',
              'cardPaymentBrick_container',
              settings
            );
          };
          
          renderCardPaymentBrick(bricksBuilder);
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'submit') {
        console.log("Card FormData from MP:", JSON.stringify(message.data));
        onSubmit(message.data);
      } else if (message.type === 'error') {
        console.error('MercadoPago Brick Error:', message.error);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  if (Platform.OS === 'web') {
    // Para la versión web, idealmente se usaría @mercadopago/sdk-react
    // Por simplicidad en este TP, mostramos un mensaje o se puede integrar el SDK web nativo
    return (
      <View style={styles.container}>
        <Text>El Card Brick en Web requiere usar @mercadopago/sdk-react o integrar el script directamente en index.html. Por favor prueba en un emulador Android/iOS o Expo Go.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'https://sdk.mercadopago.com' }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        nestedScrollEnabled={true}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 700, // Fijar una altura explícita para evitar que se colapse en 0
    width: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
