const axios = require("axios");
const config = require("./config");

module.exports = class GraphAPIs {
  static async callSendAPI(requestBody) {
    try {
      await axios.post(`${config.mPlatfom}/me/messages`, requestBody, {
        params: { access_token: config.pageAccesToken },
      });
    } catch (error) {
      console.error("Unable to send message:", error);
    }
  }

  static async callMessengerProfileAPI(requestBody) {
    console.log(`Setting Messenger Profile for app ${config.appId}`);
    try {
      const response = await axios.post(
        `${config.mPlatfom}/me/messenger_profile`,
        requestBody,
        {
          params: { access_token: config.pageAccesToken },
        }
      );
      console.log("Request sent:", response.data);
    } catch (error) {
      console.error("Unable to send message:", error);
    }
  }

  static async callSubscriptionsAPI() {
    console.log(`Setting app ${config.appId} callback url to ${config.webhookUrl}`);
    try {
      const response = await axios.post(
        `${config.mPlatfom}/${config.appId}/subscriptions`,
        null,
        {
          params: {
            access_token: `${config.appId}|${config.appSecret}`,
            object: "page",
            callback_url: config.webhookUrl,
            verify_token: config.verifyToken,
            fields:
              "messages, messaging_postbacks, messaging_optins, " +
              "message_deliveries, messaging_referrals",
            include_values: "true",
          },
        }
      );
      console.log("Request sent:", response.data);
    } catch (error) {
      console.error("Unable to send message:", error);
    }
  }

  static async callSubscribedApps() {
    try {
      const response = await axios.get(
        `${config.mPlatfom}/${config.appId}/subscribed_apps`,
        {
          params: {
            access_token: `${config.appId}|${config.appSecret}`,
          },
        }
      );
      console.log("Subscribed apps:", response.data);
    } catch (error) {
      console.error("Unable to fetch subscribed apps:", error);
    }
  }

  static async callUserProfileAPI(senderPsid) {
    try {
      const response = await axios.get(`${config.mPlatfom}/${senderPsid}`, {
        params: {
          access_token: config.pageAccesToken,
          fields: "first_name, last_name, gender, locale, timezone",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Unable to fetch profile:", error);
      throw new Error("Network Error");
    }
  }

  static async getPersonaAPI() {
    console.log(`Fetching personas for app ${config.appId}`);
    try {
      const response = await axios.get(`${config.mPlatfom}/me/personas`, {
        params: {
          access_token: config.pageAccesToken,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error("Unable to fetch personas:", error);
      throw new Error("Network Error");
    }
  }

  static async postPersonaAPI(name, profile_picture_url) {
    console.log(`Creating a Persona for app ${config.appId}`);
    const requestBody = {
      name: name,
      profile_picture_url: profile_picture_url,
    };
    try {
      const response = await axios.post(
        `${config.mPlatfom}/me/personas`,
        requestBody,
        {
          params: {
            access_token: config.pageAccesToken,
          },
        }
      );
      return response.data.id;
    } catch (error) {
      console.error("Unable to create a persona:", error);
    }
  }

  static async callNLPConfigsAPI() {
    console.log(`Enable Built-in NLP for Page ${config.pageId}`);
    try {
      const response = await axios.post(
        `${config.mPlatfom}/me/nlp_configs`,
        null,
        {
          params: {
            access_token: config.pageAccesToken,
            nlp_enabled: true,
          },
        }
      );
      console.log("Request sent:", response.data);
    } catch (error) {
      console.error("Unable to configure built-in NLP:", error);
    }
  }

  static callFBAEventsAPI(senderPsid, eventName) {
    const requestBody = {
      event: "CUSTOM_APP_EVENTS",
      custom_events: JSON.stringify([
        {
          _eventName: "postback_payload",
          _value: eventName,
          _origin: "original_coast_clothing",
        },
      ]),
      advertiser_tracking_enabled: 1,
      application_tracking_enabled: 1,
      extinfo: JSON.stringify(["mb1"]),
      page_id: config.pageId,
      page_scoped_user_id: senderPsid,
    };

    axios
      .post(`${config.mPlatfom}/${config.appId}/activities`, requestBody)
      .then(() => {
        console.log(`FBA event '${eventName}'`);
      })
      .catch((error) => {
        console.error(`Unable to send FBA event '${eventName}':` + error);
      });
  }
};
