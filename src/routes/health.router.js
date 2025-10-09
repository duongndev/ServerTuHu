import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Health check endpoint
router.get("/", async (req, res) => {
  try {
    const healthCheck = {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      services: {
        server: {
          status: "healthy",
          port: process.env.PORT || 5000
        },
        database: {
          status: "unknown",
          connection: "disconnected"
        }
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
      }
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.services.database.status = "healthy";
      healthCheck.services.database.connection = "connected";
      
      // Test database with a simple ping
      await mongoose.connection.db.admin().ping();
      healthCheck.services.database.ping = "successful";
    } else if (mongoose.connection.readyState === 2) {
      healthCheck.services.database.status = "connecting";
      healthCheck.services.database.connection = "connecting";
    } else {
      healthCheck.services.database.status = "unhealthy";
      healthCheck.services.database.connection = "disconnected";
      healthCheck.status = "DEGRADED";
    }

    // Determine overall status
    const isHealthy = healthCheck.services.database.status === "healthy" && 
                     healthCheck.services.server.status === "healthy";
    
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json(healthCheck);
    
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        server: { status: "healthy" },
        database: { status: "unhealthy", error: error.message }
      }
    });
  }
});

// Liveness probe - simple endpoint for basic health check
router.get("/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString()
  });
});

// Readiness probe - check if app is ready to serve traffic
router.get("/ready", async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
        database: "connected"
      });
    } else {
      res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        database: "disconnected"
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;