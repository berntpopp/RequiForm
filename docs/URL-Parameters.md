# Using URL Parameters

RequiForm supports URL parameters to pre-populate form fields, allowing integration with other systems such as Electronic Health Records (EHRs). Parameters can be passed via hash fragment (`#`) or query string (`?`). Using the hash fragment is generally preferred as it doesn't typically get sent to servers or logged in the same way as query strings.

## Basic Usage

Parameters are passed after a hash (`#`) in the URL. Key-value pairs are separated by `&`. Values should be URL-encoded if they contain special characters (like spaces).

**Example:**

```url
http://localhost:5173/#givenName=John&familyName=Doe&diagnosis=Suspected%20Renal%20Disease
```

## Parameter Handling

The application uses a utility function (`useUrlParameters.js`) to parse parameters from `window.location.hash` (and potentially `window.location.search` as a fallback). It prioritizes the hash fragment. The parsed parameters are then used to initialize the form data state.

## Supported Parameters

### Patient Information

- `givenName` or `firstName`: Patient's given/first name
- `familyName` or `lastName`: Patient's family/last name
- `birthdate`: Patient's birthdate in YYYY-MM-DD format
- `sex`: Patient's sex (`male`, `female`, or `other`)
- `insurance`: Insurance provider name
- `insuranceId`: Insurance ID number
- `physicianName` or `referrer`: Referring physician's name

### Clinical Information

- `diagnosis`: Patient's diagnosis or clinical suspicion (required field in the form, but optional as a parameter)
- `category`: Test category (e.g., "nephrology", "cancer", "neurology") - *Note: Validation against available categories might apply.*
- `panels`: Comma-separated list of panel IDs to pre-select (e.g., "nephronophthise,alport_thin_basement") - *Note: IDs must match those defined in the test schema.*
- `hpo`: Comma-separated list of HPO terms to pre-select and mark as **present**. Prefix with `+`. (e.g., `+HP:0000077,+HP:0000123`).
- `hpo_absent`: Comma-separated list of HPO terms to pre-select and mark as **absent**. Prefix with `-`. (e.g., `-HP:0000555,-HP:0000999`).

### Legacy Parameters

- `selectedTests`: Alias for `panels` (maintained for backward compatibility).

## Combined Example URL

```url
http://localhost:5173/#givenName=Jane&familyName=Doe&birthdate=1990-02-01&insurance=ABC&physicianName=Dr.%20Smith&sex=female&category=nephrology&diagnosis=Suspected%20Chronic%20Kidney%20Disease&panels=nephronophthise,alport_thin_basement&hpo=%2BHP%3A0000077&hpo_absent=-HP%3A0000555
```

This URL will pre-populate the form with Jane Doe's information, select the specified panels in the nephrology category, mark HP:0000077 as present, and mark HP:0000555 as absent.

## Security Note

While parameters passed via the hash fragment are generally considered more secure than query strings (they aren't typically sent to the server), avoid putting highly sensitive, identifiable information directly in *any* URL if possible. For secure sharing of complete form data, use the "Share Encrypted Link" feature.
