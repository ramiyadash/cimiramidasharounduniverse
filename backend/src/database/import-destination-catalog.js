require('dotenv').config();

const mongoose =
  require('mongoose');

const {
  connectDatabase
} =
  require('../config/database');

const Destination =
  require('../models/destination.model');

const destinations =
  require('../catalog/destinations.json');

/**
 * The importer performs a dry run unless --apply
 * is explicitly supplied.
 *
 * It upserts by slug and never deletes destinations.
 */
async function importDestinationCatalog() {
  const shouldApply =
    process.argv.includes(
      '--apply'
    );

  try {
    await connectDatabase();

    console.log(
      shouldApply
        ? 'Applying destination catalog...'
        : 'Validating destination catalog (dry run)...'
    );

    const seenSlugs =
      new Set();

    for (
      const destinationData
      of destinations
    ) {
      if (
        seenSlugs.has(
          destinationData.slug
        )
      ) {
        throw new Error(
          `Duplicate catalog slug: ` +
          `${destinationData.slug}`
        );
      }

      seenSlugs.add(
        destinationData.slug
      );

      /**
       * Creating an unsaved document runs the complete
       * schema validation, including range checks.
       */
      const validationDocument =
        new Destination(
          destinationData
        );

      await validationDocument
        .validate();

      if (!shouldApply) {
        console.log(
          `Validated: ` +
          `${destinationData.name}`
        );

        continue;
      }

      const destination =
        await Destination
          .findOneAndUpdate(
            {
              slug:
                destinationData.slug
            },

            {
              $set:
                destinationData
            },

            {
              new: true,
              upsert: true,
              runValidators: true,
              setDefaultsOnInsert: true
            }
          );

      console.log(
        `Imported: ` +
        `${destination.name} ` +
        `(${destination._id.toString()})`
      );
    }

    console.log(
      shouldApply
        ? 'Destination catalog import completed.'
        : 'Dry run completed. No records were changed.'
    );
  } catch (error) {
    console.error(
      'Destination catalog import failed:',
      error
    );

    process.exitCode =
      1;
  } finally {
    await mongoose.connection
      .close();
  }
}

importDestinationCatalog();