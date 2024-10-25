// Utility function to format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const options = {
        weekday: 'short', // Example: Mon, Tue, Wed
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // Use 24-hour format
    };
    return date.toLocaleString('en-GB', options);
}
module.exports = formatTimestamp;
