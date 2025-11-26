const db = require("../config/database");
const User = require("../models/User");
const bcrypt = require("bcrypt");

exports.check = async (email, password) => {
  const [user] = await User.findByEmail(email);

  if (!user) {
    return { auth: false, user: null };
  }

  const auth = await bcrypt.compare(password, user.sifre_hash);
  return { user, auth };
};
