const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const authHeader = req.header("Authorization");

        // Check if the token is provided and valid
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "notok",
                msg: "Authorization denied. Token not provided or invalid format.",
            });
        }

        // Extract the token
        const token = authHeader.split(" ")[1];

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultSecret");

        // Attach user data to the request object
        req.user = decoded;

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        console.error("Error in authentication middleware:", err.message);

        // Differentiate between invalid token and token expiration
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                status: "notok",
                msg: "Session expired. Please log in again.",
            });
        }

        return res.status(403).json({
            status: "notok",
            msg: "Invalid token. Access denied.",
        });
    }
};

module.exports = auth;
