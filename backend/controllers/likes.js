const Sauce = require("../models/sauce");

exports.addALike = (req, res, next) => {
  if (req.body.like == 1) {
    Sauce.updateOne(
      { _id: req.params.id },
      {
        $push: { usersLiked: [req.body.userId] },
        $inc: { likes: req.body.like },
        ...req.body,
        _id: req.params.id,
      }
    )

      .then(() => res.status(200).json({ message: "Objet modifié !" }))
      .catch((error) => res.status(400).json({ error }));
  }

  if (req.body.like == -1) {
    Sauce.updateOne(
      { _id: req.params.id },
      {
        $push: { usersDisliked: [req.body.userId] },
        $inc: { dislikes: 1 },
        ...req.body,
        _id: req.params.id,
      }
    )

      .then(() => res.status(200).json({ message: "Objet modifié !" }))
      .catch((error) => res.status(400).json({ error }));
  }

  if (req.body.like == 0) {
    console.log(req.params);
    console.log(req.body);
    Sauce.findOne({ _id: req.params.id }).then((sauce) => {
      let usersLikedFound = false;
      for (index = 0; index < sauce.usersLiked.length; index++) {
        if (sauce.usersLiked[index] == req.body.userId) {
          usersLikedFound = true;
        }
      }
      if (usersLikedFound == false) {
        console.log(
          "Ya rien dans ton usersLiked ! => il avait pas aimé la sauce donc on enlève le vote des usersDisliked"
        );

        Sauce.updateOne(
          { _id: req.params.id },
          {
            $pull: { usersDisliked: req.body.userId },
            $inc: { dislikes: -1 },
            ...req.body,
            _id: req.params.id,
          }
        )
          .then(() => res.status(200).json({ message: "Objet modifié !" }))
          .catch((error) => res.status(400).json({ error }));
      } else {
        Sauce.updateOne(
          { _id: req.params.id },
          {
            $pull: { usersLiked: req.body.userId },
            $inc: { likes: -1 },
            ...req.body,
            _id: req.params.id,
          }
        )
          .then(() => res.status(200).json({ message: "Objet modifié !" }))
          .catch((error) => res.status(400).json({ error }));
      }
    });
  }
};
