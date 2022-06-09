import React from "react";
import { Global, css } from "@emotion/react";

import { CssBaseline } from "@mui/material";

const CssResetStyle = css`
  html {
    box-sizing: border-box;
  }
  *,
  *:before,
  *:after {
    box-sizing: inherit;
    margin: 0;
    padding: 0;
  }

  body {
    margin: 0;
    padding: 0;
    min-height: 100%;
    min-width: 100%;
  }
  #___gatsby #gatsby-focus-wrapper {
    min-height: 100vh;
    min-width: 100%;
  }
`;

const CssReset = (): JSX.Element => (
  <>
    <CssBaseline />
    <Global styles={CssResetStyle} />
  </>
);

export default CssReset;
