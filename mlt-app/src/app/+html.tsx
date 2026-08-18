import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveGlobalStyles }} />
      </head>
      <body style={{ backgroundColor: '#020617', margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}

const responsiveGlobalStyles = `
html, body {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden !important;
  background-color: #020617 !important;
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}
#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden !important;
  background-color: #020617 !important;
}
* {
  box-sizing: border-box;
}
`;
