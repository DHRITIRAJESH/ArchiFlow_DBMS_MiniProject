// Maps MySQL error numbers to friendly messages + HTTP status codes
export function dbError(err) {
  console.error(err);
  const send = (message, status) => Response.json({ error: message }, { status });

  switch (err.errno) {
    case 1062: // ER_DUP_ENTRY
      return send("That value already exists (for example a duplicate email).", 409);
    case 1451: // ER_ROW_IS_REFERENCED_2
      return send("Cannot delete: other records (such as projects) still depend on this one.", 409);
    case 1452: // ER_NO_REFERENCED_ROW_2
      return send("A referenced record does not exist.", 400);
    case 3819: // ER_CHECK_CONSTRAINT_VIOLATED
      return send("A value breaks a database rule (for example an invalid phone number).", 400);
    case 1406: // ER_DATA_TOO_LONG
      return send("One of the values is too long.", 400);
    case 1644: // our triggers/procedures use SIGNAL SQLSTATE '45000'
      return send(err.sqlMessage, 400);
    default:
      return send("Something went wrong on the server.", 500);
  }
}
