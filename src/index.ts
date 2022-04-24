import { app, initHttpConfig, startHttpServer } from "./initDefaultHttp";
import { initOracleDatabaseConnection } from "./utils/initOracleDatabaseConnection";
import { logError, logLine, logStartup } from "@rad-common";
import { streamQuery } from "./utils/streamQuery";
import { generateApi } from "./utils/generateApi";
import { readApiConfig } from "./utils/readApiConfig";
import { getDefaultConfig } from "./utils/getDefaultConfig";

async function start() {
    // init database connection
    await initOracleDatabaseConnection();

    // todo check access layer works, lets just add a fetch here for now
    try {
        await streamQuery(
            `select username from AI_WEB_USER fetch first 1 rows only`,
            [],
            "na",
            "AI_WEB_USER",
            true,
            (data) => {
                logStartup("ORACLE ACCESS DB TEST: ", data);
            },
            true
        );
    } catch (e) {
        logError("ORACLE ACCESS DB ERROR: default tables need to have be added");
        logError("ORACLE ACCESS DB ERROR:", e);
        // exit
        process.exit(1);
    }

    // init http server settings
    await initHttpConfig();

    // time to start server
    startHttpServer();

    const { apis, errors } = readApiConfig(getDefaultConfig());

    if (errors.length) {
        errors.forEach((err) => {
            logError(err.apiname, " fails checks, service will be forced to quit, fix error before you try again");
            // todo log out all errors
        });
        process.exit(1);
    }

    apis.forEach((api) => {
        generateApi(app, api);
        logStartup("API added :", api.viewName);
    });

    // TODO: read out dynamic API

    logLine(true);
}
start();
