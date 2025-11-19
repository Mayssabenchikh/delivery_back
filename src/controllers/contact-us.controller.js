const pool = require("../config/database");

exports.sendContact = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { fullname, email, tell } = req.body;

    if (!fullname || !email || !tell) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    await connection.execute(
      "INSERT INTO contact (fullname,email,tell) values (?,?,?)",
      [fullname, email, tell]
    );

    res.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  } finally {
    connection.release();
  }
};

exports.getContacts = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [contacts] = await connection.execute("SELECT * FROM contact");
    res.json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  } finally {
    connection.release();
  }
};

exports.deleteContacts = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    await connection.execute("DELETE FROM contact where id = ?", [id]);

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  } finally {
    connection.release();
  }
};
