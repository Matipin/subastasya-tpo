import React, { useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';

// Tomamos la clave pública de las variables de entorno de Expo
const MP_PUBLIC_KEY = process.env.EXPO_PUBLIC_MP_PUBLIC_KEY || 'APP_USR-f1a23340-97eb-44c1-9032-fb94dd016259'; // Clave de prueba si no hay env

interface MercadoPagoBrickProps {
  onSubmit: (cardFormData: any) => void;
  usuarioEmail: string;
}

export default function MercadoPagoBrick({ onSubmit, usuarioEmail }: MercadoPagoBrickProps) {
  const webViewRef = useRef<WebView>(null);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://sdk.mercadopago.com/js/v2"></script>
        <style>
          body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: transparent; }
          #cardPaymentBrick_container { margin-top: 10px; }
          #loading-info { color: #666; font-size: 14px; text-align: center; margin-top: 20px; font-weight: 500; }
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
                amount: 100, // Required by MP for card Payment brick
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

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'submit') {
        onSubmit(message.data);
      } else if (message.type === 'error') {
        console.error('MercadoPago Brick Error:', message.error);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text>El Card Brick en Web requiere usar @mercadopago/sdk-react. Por favor prueba en un emulador o Expo Go.</Text>
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
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 500, // Fijar una altura explícita para evitar que se colapse
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
