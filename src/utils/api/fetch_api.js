import axios from "axios";

import {
  reCaptchaV3SiteKey,
  IS_RECAPTCHA_ENABLED
} from "../../config/config.js";
import { IS_CONSOLE_LOG_OPEN } from "../../utils/constants/constants.js";

const script = document.createElement("script");
script.src = `https://www.google.com/recaptcha/api.js?render=${reCaptchaV3SiteKey}`;
document.body.appendChild(script);

function reCaptchaToken(action) {
  return new Promise(resolve => {
    grecaptcha.ready(async () => {
      const token = await grecaptcha.execute(reCaptchaV3SiteKey, {
        action: action
      });
      resolve(token);
    });
  });
}

function log(url, config, response) {
  return (
    IS_CONSOLE_LOG_OPEN &&
    console.log(
      "Request : ",
      url,
      " Params : ",
      config,
      " Response : ",
      response,
      new Date()
    )
  );
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function removeAllCookies() {
  document.cookie =
    "google_access_token_expiration=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie =
    "jobhax_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie =
    "jobhax_access_token_expiration=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie =
    "jobhax_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie =
    "remember_me=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

export async function axiosCaptcha(url, config, action) {
  let response = null;
  config.headers.Authorization = getCookie("jobhax_access_token");
  const recaptchaToken = await reCaptchaToken(action);
  //console.log(action, recaptchaToken);
  if (config.method === "GET") {
    response = await axios.get(url, config).catch(error => {
      console.log(error);
    });
    log(url, config, response);
  } else if (config.method === "POST") {
    if (
      action != false &&
      grecaptcha != null &&
      IS_RECAPTCHA_ENABLED === false
    ) {
      const recaptchaToken = await reCaptchaToken(action);
      if (config.body) {
        config.body["recaptcha_token"] = recaptchaToken;
        config.body["action"] = action;
      } else {
        config["body"] = { recaptcha_token: recaptchaToken };
        config.body["action"] = action;
      }
      if (url.split("api")[1] === "/users/verify_recaptcha") {
        response = await axios({
          method: "POST",
          url: url,
          data: JSON.stringify(config.body),
          headers: config.headers
        }).catch(error => {
          console.log(error);
        });
        log(url, config, response);
      }
    }
    if (url.split("api")[1] != "/users/verify_recaptcha") {
      response = await axios({
        method: "POST",
        url: url,
        data:
          config.headers["Content-Type"] != "multipart/form-data"
            ? JSON.stringify(config.body)
            : config.body,
        headers: config.headers
      }).catch(error => {
        console.log(error);
      });
      log(url, config, response);
    }
  }

  if (response != null) {
    if (response.data.error_code === 99) {
      removeAllCookies();
      window.location = "/signin?alert=reCapthcaCouldNotPassed";
    }
    return response;
  }
}
